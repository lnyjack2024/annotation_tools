import { Button, Modal, Input, Spin, message } from "antd";
import { EmailAuthFlag } from "@/models/user";
import { useIntl } from "@umijs/max";
import { useEffect, useState } from "react";
import useCountdown from "@/hooks/useCountdown";
import {
  sendEmailVerficationCode,
  validateVerficationCode,
} from "@/services/user";
import { HttpStatus } from "@/types";
import { mapStatusToErrorMessage } from "@/utils";

type Props = {
  visible: boolean;
  email: string;
  emailAuthFlag: EmailAuthFlag | "";
  fetchCurrentUser: () => void;
};

export default function EmailVerifyModal({
  visible,
  emailAuthFlag,
  email,
  fetchCurrentUser,
}: Props) {
  const [validationCode, setValidationCode] = useState("");
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, { startCountdown }] = useCountdown(60, { autoStart: false });
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (visible) {
      sendVerificationCode();
    }
  }, [visible]);

  const sendVerificationCode = () => {
    setLoading(true);
    sendEmailVerficationCode()
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          startCountdown();
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((err) => {
        message.error(mapStatusToErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const verify = async () => {
    setLoading(true);
    try {
      const resp = await validateVerficationCode({ authCode: validationCode });
      if (resp.status === HttpStatus.OK) {
        await fetchCurrentUser();
        message.success(
          formatMessage({
            id: "profile.security.email.verification-code.succeed",
          })
        );
      } else {
        message.error(mapStatusToErrorMessage(resp));
        setVerifyFailed(true);
      }
    } catch (err) {
      message.error(mapStatusToErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={formatMessage({ id: "menu.pending-verify" })}
      className="custom-modal"
      maskClosable={false}
      closable={false}
      keyboard={false}
      footer={null}
      style={{ color: "#42526E" }}
    >
      <Spin spinning={loading}>
        <p>
          {emailAuthFlag &&
            formatMessage({ id: `profile.security.email.${emailAuthFlag}` })}
        </p>
        <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 0 }}>
          {email}
        </p>
        <p>
          {formatMessage({
            id: "profile.security.email.verification-code.sent",
          })}
        </p>
        {timeLeft === 0 ? (
          <>
            <span>
              {formatMessage({
                id: "profile.security.email.verification-code.no-received",
              })}
            </span>
            <Button
              type="link"
              onClick={(e) => {
                e.preventDefault();
                sendVerificationCode();
              }}
            >
              {formatMessage({
                id: "profile.security.email.verification-code.re-send",
              })}
            </Button>
          </>
        ) : (
          <span>
            {formatMessage(
              { id: "profile.security.email.verification-code.countdown" },
              { num: timeLeft }
            )}
          </span>
        )}

        <Input.Group style={{ paddingTop: 24 }} compact>
          <Input
            placeholder={formatMessage({
              id: "profile.security.email.verification-code.placeholder",
            })}
            style={{ width: 300, marginRight: 8 }}
            status={verifyFailed ? "error" : ""}
            onChange={(e) => {
              setValidationCode(e.target.value);
              verifyFailed && setVerifyFailed(false);
            }}
          />
          <Button
            type="primary"
            disabled={validationCode.length <= 0}
            onClick={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            {formatMessage({ id: "profile.security.email.verification-code" })}
          </Button>
        </Input.Group>
        {verifyFailed && (
          <p style={{ color: "#F56C6C", paddingTop: 4, marginBottom: 0 }}>
            {formatMessage({
              id: "profile.security.email.verification-code.failed",
            })}
          </p>
        )}
      </Spin>
    </Modal>
  );
}
